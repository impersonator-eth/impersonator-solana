import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  Center,
  useToast,
} from "@chakra-ui/react";
import { parseUri } from "@walletconnect/utils";
import ModalStore from "@/src/store/ModalStore";
import { web3wallet } from "@/src/utils/WalletConnectUtil";
import SettingsStore from "@/src/store/SettingsStore";
import { useSnapshot } from "valtio";
import { getEnsAddress, getEnsAvatar } from "@/src/helpers/utils";
import { isAddress } from "viem";
import { SignClientTypes } from "@walletconnect/types";
import { EIP155_SIGNING_METHODS } from "@/src/data/EIP155Data";
import { Web3WalletTypes } from "@walletconnect/web3wallet";

interface WalletConnectParams {
  setIsEIP155AddressValid: (isValid: boolean) => void;
}

export default function WalletConnect({
  setIsEIP155AddressValid,
}: WalletConnectParams) {
  const toast = useToast();

  const { eip155Address, isConnectLoading, initialized, isEventsInitialized } =
    useSnapshot(SettingsStore.state);

  const [uri, setUri] = useState("");
  const [pasted, setPasted] = useState(false);

  const resolveAndValidateAddress = async () => {
    let isValid = true;
    let _eip155address = eip155Address;
    // if (!eip155Address) {
    //   isValid = false;
    // } else {
    //   // Resolve ENS
    //   const resolvedAddress = await getEnsAddress(eip155Address);
    //   if (resolvedAddress) {
    //     _eip155address = resolvedAddress;
    //     isValid = true;

    //     // resolve ENS avatar
    //     getEnsAvatar(eip155Address).then((res) => {
    //       if (res) {
    //         SettingsStore.setEnsAvatar(res);
    //       }
    //     });
    //   } else if (isAddress(eip155Address)) {
    //     isValid = true;
    //   } else {
    //     isValid = false;
    //   }
    // }

    if (!isValid) {
      toast({
        title: "Invalid Address",
        description: "Address is not an ENS or Ethereum address",
        status: "error",
        isClosable: true,
        duration: 4000,
      });
    }

    return { isValid, _address: _eip155address };
  };

  async function onConnect() {
    SettingsStore.setIsConnectLoading(true);
    const { isValid, _address } = await resolveAndValidateAddress();
    setIsEIP155AddressValid(isValid);
    SettingsStore.setEIP155Address(_address);
    if (!isValid) {
      SettingsStore.setIsConnectLoading(false);
      return;
    }

    const { topic: pairingTopic } = parseUri(uri);
    // if for some reason, the proposal is not received, we need to close the modal when the pairing expires (5mins)
    const pairingExpiredListener = ({ topic }: { topic: string }) => {
      if (pairingTopic === topic) {
        console.log(
          "Pairing expired. Please try again with new Connection URI",
          "error"
        );
        ModalStore.close();
        web3wallet.core.pairing.events.removeListener(
          "pairing_expire",
          pairingExpiredListener
        );
      }
    };

    /// === SETUP EVENTS ===
    /******************************************************************************
     * 1. Open session proposal modal for confirmation / rejection
     *****************************************************************************/
    if (!isEventsInitialized) {
      SettingsStore.setIsEventsInitialized(true);

      web3wallet.on(
        "session_proposal",
        (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
          console.log("session_proposal", proposal);
          // set the verify context so it can be displayed in the projectInfoCard
          SettingsStore.setCurrentRequestVerifyContext(proposal.verifyContext);
          ModalStore.open("SessionProposalModal", { proposal });

          web3wallet.core.pairing.events.removeListener(
            "pairing_expire",
            pairingExpiredListener
          );
        }
      );
      web3wallet.on(
        "session_request",
        async (
          requestEvent: SignClientTypes.EventArguments["session_request"]
        ) => {
          console.log("session_request", requestEvent);
          const { topic, params, verifyContext } = requestEvent;
          const { request } = params;
          const requestSession =
            web3wallet.engine.signClient.session.get(topic);
          // set the verify context so it can be displayed in the projectInfoCard
          SettingsStore.setCurrentRequestVerifyContext(verifyContext);

          switch (request.method) {
            case EIP155_SIGNING_METHODS.ETH_SIGN:
            case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
              return ModalStore.open("SessionSignModal", {
                requestEvent,
                requestSession,
              });

            case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
            case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
            case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
              return ModalStore.open("SessionSignTypedDataModal", {
                requestEvent,
                requestSession,
              });

            case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
            case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
              return ModalStore.open("SessionSendTransactionModal", {
                requestEvent,
                requestSession,
              });

            default:
              return ModalStore.open("SessionUnsuportedMethodModal", {
                requestEvent,
                requestSession,
              });
          }
        }
      );
      web3wallet.on("auth_request", (request: Web3WalletTypes.AuthRequest) => {
        ModalStore.open("AuthRequestModal", { request });
      });
      web3wallet.engine.signClient.events.on("session_ping", (data) =>
        console.log("ping", data)
      );
      web3wallet.on("session_delete", (data) => {
        console.log("session_delete event received", data);
        SettingsStore.setSessions(
          Object.values(web3wallet.getActiveSessions())
        );
      });
    }

    try {
      web3wallet.core.pairing.events.on(
        "pairing_expire",
        pairingExpiredListener
      );
      await web3wallet.pair({ uri });
    } catch (error) {
      console.log((error as Error).message, "error");
      ModalStore.close();
    }
  }

  useEffect(() => {
    if (pasted) {
      onConnect();
      setPasted(false);
    }
  }, [uri]);

  return (
    <>
      <FormControl mt="1rem" mb="1rem">
        <FormLabel fontWeight={"bold"}>WalletConnect URI (from dapp)</FormLabel>
        <Input
          placeholder="wc:xyz123..."
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            if (!initialized) return;
            setPasted(true);
            setUri(e.clipboardData.getData("text"));
          }}
          bg={"brand.lightBlack"}
        />
      </FormControl>
      <Center>
        {initialized && (
          <Button
            onClick={() => onConnect()}
            isLoading={isConnectLoading}
            isDisabled={!initialized}
          >
            Connect
          </Button>
        )}
      </Center>
    </>
  );
}
