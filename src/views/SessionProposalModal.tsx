import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Box,
  Center,
  HStack,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@chakra-ui/react";
import {
  SignClientTypes,
  ProposalTypes,
  SessionTypes,
} from "@walletconnect/types";
import { getSdkError } from "@walletconnect/utils";
import { useSnapshot } from "valtio";
import ModalStore from "@/src/store/ModalStore";
import { web3wallet } from "@/src/utils/WalletConnectUtil";
import SettingsStore from "@/src/store/SettingsStore";

function hasSolanaNamespace(params: SignClientTypes.EventArguments["session_proposal"]["params"]): boolean {
  const { requiredNamespaces, optionalNamespaces } = params;
  return !!(requiredNamespaces?.solana || optionalNamespaces?.solana);
}

export default function SessionProposalModal() {
  const { eip155Address } = useSnapshot(SettingsStore.state);
  const data = useSnapshot(ModalStore.state);
  const proposal = data?.data
    ?.proposal as SignClientTypes.EventArguments["session_proposal"];

  const [isApproved, setIsApproved] = useState(false);
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);

  const supportsSolana = useMemo(
    () => hasSolanaNamespace(proposal.params),
    [proposal]
  );

  // only approve once (or else duplicate sessions created)
  useEffect(() => {
    if (!isApproved && supportsSolana) {
      onApprove();
    }
  }, []);

  const namespaces = useMemo(() => {
    if (!supportsSolana) return null;

    const { requiredNamespaces, optionalNamespaces } = proposal.params;
    const requiredNamespace = requiredNamespaces?.solana as
      | ProposalTypes.BaseRequiredNamespace
      | undefined;
    const optionalNamespace = optionalNamespaces?.solana;

    let chains: string[] | undefined =
      requiredNamespace === undefined ? undefined : requiredNamespace.chains;
    if (optionalNamespace && optionalNamespace.chains) {
      if (chains) {
        chains = Array.from(new Set(chains.concat(optionalNamespace.chains)));
      } else {
        chains = optionalNamespace.chains;
      }
    }

    const accounts: string[] = [];
    chains?.map((chain) => {
      accounts.push(`${chain}:${eip155Address}`);
      return null;
    });

    const methods = [
      ...(requiredNamespace?.methods ?? []),
      ...(optionalNamespace?.methods ?? []),
    ];
    const events = [
      ...(requiredNamespace?.events ?? []),
      ...(optionalNamespace?.events ?? []),
    ];

    if (!methods.includes("personal_sign")) methods.push("personal_sign");
    if (!methods.includes("solana_signTransaction"))
      methods.push("solana_signTransaction");

    const namespace: SessionTypes.Namespace = {
      accounts,
      chains,
      methods,
      events,
    };

    return { solana: namespace };
  }, [proposal, eip155Address, supportsSolana]);

  // Handle approve action, construct session namespace
  const onApprove = useCallback(async () => {
    setIsApproved(true);

    if (proposal && namespaces) {
      SettingsStore.setIsConnectLoading(false);
      setIsLoadingApprove(true);

      try {
        await web3wallet.approveSession({
          id: proposal.id,
          namespaces,
        });
        SettingsStore.setSessions(
          Object.values(web3wallet.getActiveSessions())
        );
      } catch (e) {
        setIsLoadingApprove(false);
        console.log((e as Error).message, "error");
        return;
      }

      setIsLoadingApprove(false);
      ModalStore.close();
    }

    setIsApproved(false);
  }, [namespaces, proposal]);

  const onReject = useCallback(async () => {
    if (proposal) {
      try {
        await web3wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError("USER_REJECTED"),
        });
      } catch (e) {
        console.log((e as Error).message, "error");
      }
    }
    SettingsStore.setIsConnectLoading(false);
    ModalStore.close();
  }, [proposal]);

  const { icons, name, url } = proposal.params.proposer.metadata;

  // Dapp doesn't support Solana via WalletConnect
  if (!supportsSolana) {
    const requestedNamespaces = Object.keys({
      ...proposal.params.requiredNamespaces,
      ...proposal.params.optionalNamespaces,
    }).join(", ");

    return (
      <ModalContent bg={"gray.900"}>
        <ModalHeader>Unsupported Dapp</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Center>
            <Avatar src={icons[0]} mr="2rem" />
            <Box>
              <Text>{name}</Text>
              <Text color={"whiteAlpha.600"}>{url}</Text>
            </Box>
          </Center>
          <Box mt="1.5rem" p="1rem" bg="red.900" borderRadius="md">
            <Text fontWeight="bold">
              This dapp does not support Solana via WalletConnect.
            </Text>
            <Text mt="0.5rem" color="whiteAlpha.700" fontSize="sm">
              Requested namespaces: {requestedNamespaces || "none"}
            </Text>
            <Text mt="0.5rem" color="whiteAlpha.700" fontSize="sm">
              The dapp only supports EVM chains through WalletConnect. Solana
              wallets may need to connect through a different method (e.g.
              Phantom, Solflare).
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onReject} colorScheme="red">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    );
  }

  return (
    <ModalContent bg={"gray.900"}>
      <ModalHeader>Session Proposal</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Center>
          <Avatar src={icons[0]} mr="2rem" />
          <Box>
            <Text>{name}</Text>
            <Text color={"whiteAlpha.600"}>{url}</Text>
          </Box>
        </Center>
      </ModalBody>
      <ModalFooter>
        <HStack>
          <Button
            onClick={() => onApprove()}
            isLoading={isLoadingApprove}
            colorScheme={"green"}
          >
            Approve
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  );
}
