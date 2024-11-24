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
import { useSnapshot } from "valtio";
import ModalStore from "@/src/store/ModalStore";
import { web3wallet } from "@/src/utils/WalletConnectUtil";
import SettingsStore from "@/src/store/SettingsStore";

export default function SessionProposalModal() {
  const { eip155Address } = useSnapshot(SettingsStore.state);
  const data = useSnapshot(ModalStore.state);
  const proposal = data?.data
    ?.proposal as SignClientTypes.EventArguments["session_proposal"];

  const [isApproved, setIsApproved] = useState(false);
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);

  // only approve once (or else duplicate sessions created)
  useEffect(() => {
    // auto-approve proposal request when modal is loaded
    if (!isApproved) {
      onApprove();
    }
  }, []);

  const namespaces = useMemo(() => {
    const { requiredNamespaces, optionalNamespaces } = proposal.params;
    const namespaceKey = "solana";
    const requiredNamespace = requiredNamespaces[namespaceKey] as
      | ProposalTypes.BaseRequiredNamespace
      | undefined;
    const optionalNamespace = optionalNamespaces
      ? optionalNamespaces[namespaceKey]
      : undefined;

    let chains: string[] | undefined =
      requiredNamespace === undefined ? undefined : requiredNamespace.chains;
    if (optionalNamespace && optionalNamespace.chains) {
      if (chains) {
        // merge chains from requiredNamespace & optionalNamespace, while avoiding duplicates
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
    const namespace: SessionTypes.Namespace = {
      accounts,
      chains: chains,
      methods: requiredNamespace === undefined ? [] : requiredNamespace.methods,
      events: requiredNamespace === undefined ? [] : requiredNamespace.events,
    };
    namespace.methods = namespace.methods.includes("personal_sign")
      ? namespace.methods
      : [...namespace.methods, "personal_sign"];

    console.log({ namespace });

    return {
      [namespaceKey]: namespace,
    };
  }, [proposal, eip155Address]);

  // Handle approve action, construct session namespace
  const onApprove = useCallback(async () => {
    console.log({ onApprove: "onApprove", namespaces, proposal });
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

  const { icons, name, url } = proposal.params.proposer.metadata;

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
