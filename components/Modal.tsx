import { useCallback, useMemo } from "react";
import { Modal as CModal, ModalOverlay } from "@chakra-ui/react";
import ModalStore from "@/src/store/ModalStore";
import { useSnapshot } from "valtio";
import SessionProposalModal from "@/src/views/SessionProposalModal";
import SessionSignModal from "@/src/views/SessionSignModal";
import SessionSendTransactionModal from "@/src/views/SessionSendTransactionModal";
import SessionUnsuportedMethodModal from "@/src/views/SessionUnsuportedMethodModal";
import { rejectEIP155Request } from "@/src/utils/EIP155RequestHandlerUtil";
import { web3wallet } from "@/src/utils/WalletConnectUtil";

export default function Modal() {
  const { open, view } = useSnapshot(ModalStore.state);

  // Get request and wallet data from store
  const requestEvent = ModalStore.state.data?.requestEvent;
  const requestSession = ModalStore.state.data?.requestSession;

  const topic = requestEvent?.topic;
  const params = requestEvent?.params;

  // Handle reject action
  const onReject = useCallback(async () => {
    if (requestEvent && topic && open) {
      const response = rejectEIP155Request(requestEvent);
      try {
        await web3wallet.respondSessionRequest({
          topic,
          response,
        });
      } catch (e) {
        console.log((e as Error).message, "error");
        return;
      }
      ModalStore.close();
    } else if (open) {
      ModalStore.close();
    }
  }, [requestEvent, topic, open]);

  const componentView = useMemo(() => {
    switch (view) {
      case "SessionProposalModal":
        return <SessionProposalModal />;
      case "SessionSignModal":
        return <SessionSignModal />;
      case "SessionSendTransactionModal":
        return <SessionSendTransactionModal />;
      case "SessionUnsuportedMethodModal":
        return <SessionUnsuportedMethodModal />;
      default:
        return null;
    }
  }, [view]);

  return (
    <CModal isOpen={open} onClose={onReject} isCentered>
      <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="3px" />
      {componentView}
    </CModal>
  );
}
