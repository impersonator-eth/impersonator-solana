"use client";
export const runtime = "nodejs";

import { useEffect, useState } from "react";
import { Container } from "@chakra-ui/react";
import MasterLayout from "@/components/MasterLayout";

import WalletConnect from "@/components/WalletConnect";
import Modal from "@/components/Modal";

import AddressInput from "@/components/AddressInput";

import useInitialization from "@/src/hooks/useInitialization";
import SettingsStore from "@/src/store/SettingsStore";
import { web3wallet } from "@/src/utils/WalletConnectUtil";
import { RELAYER_EVENTS } from "@walletconnect/core";

export default function Home() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [isEIP155AddressValid, setIsEIP155AddressValid] = useState(true);
  // FIXME: these
  const [isConnected, setIsConnected] = useState(false);
  const appUrl = "";
  const updateAddress = () => {};

  // Step 1 - Initialize wallets and wallet connect client
  const initialized = useInitialization();
  SettingsStore.setInitialized(initialized);

  useEffect(() => {
    if (!initialized) return;
    web3wallet?.core.relayer.on(RELAYER_EVENTS.connect, () => {
      console.log("Network connection is restored!", "success");
    });

    web3wallet?.core.relayer.on(RELAYER_EVENTS.disconnect, () => {
      console.log("Network connection lost.", "error");
    });
  }, [initialized]);

  return (
    <MasterLayout hideConnectWalletBtn={false}>
      <Container mt="10" mb="16" minW={["0", "0", "2xl", "2xl"]}>
        <AddressInput
          selectedTabIndex={selectedTabIndex}
          isConnected={isConnected}
          appUrl={appUrl}
          isIFrameLoading={isIFrameLoading}
          updateAddress={updateAddress}
          isEIP155AddressValid={isEIP155AddressValid}
          setIsEIP155AddressValid={setIsEIP155AddressValid}
        />
        <WalletConnect setIsEIP155AddressValid={setIsEIP155AddressValid} />
      </Container>

      <Modal />
    </MasterLayout>
  );
}
