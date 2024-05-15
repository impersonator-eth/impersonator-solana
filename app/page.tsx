"use client";
export const runtime = "nodejs";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Image,
  Text,
  CloseButton,
  Progress,
  CircularProgress,
  Spinner,
} from "@chakra-ui/react";
import MasterLayout from "@/components/MasterLayout";

import WalletConnect from "@/components/WalletConnect";
import Modal from "@/components/Modal";

import AddressInput from "@/components/AddressInput";

import SettingsStore from "@/src/store/SettingsStore";
import { createWeb3Wallet, web3wallet } from "@/src/utils/WalletConnectUtil";
import { RELAYER_EVENTS } from "@walletconnect/core";
import { useSnapshot } from "valtio";
import { getSdkError } from "@walletconnect/utils";
import { SessionTypes } from "@walletconnect/types";

const SessionTab = ({ session }: { session: SessionTypes.Struct }) => {
  return (
    <Tab>
      <HStack>
        <Image
          w="1.4rem"
          src={session.peer.metadata.icons[0]}
          alt={session.peer.metadata.name + " logo"}
        />
        <Text>{session.peer.metadata.name}</Text>
        <CloseButton
          size="sm"
          onClick={async (e) => {
            e.preventDefault();
            await web3wallet.disconnectSession({
              topic: session.topic,
              reason: getSdkError("USER_DISCONNECTED"),
            });
            SettingsStore.setSessions(
              Object.values(web3wallet.getActiveSessions())
            );
          }}
        />
      </HStack>
    </Tab>
  );
};

export default function Home() {
  const { sessions, initialized } = useSnapshot(SettingsStore.state);

  const [selectedTabIndex, setSelectedTabIndex] = useState(1);
  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [isEIP155AddressValid, setIsEIP155AddressValid] = useState(true);
  const [initSessionsLoaded, setInitSessionsLoaded] = useState(false);
  // FIXME: these
  const [isConnected, setIsConnected] = useState(false);
  const appUrl = "";
  const updateAddress = () => {};

  const onInitialize = useCallback(async () => {
    try {
      await createWeb3Wallet();
      SettingsStore.setInitialized(true);
    } catch (err: unknown) {
      console.error("Initialization failed", err);
      alert(err);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  useEffect(() => {
    if (!initialized) return;
    web3wallet?.core.relayer.on(RELAYER_EVENTS.connect, () => {
      console.log("Network connection is restored!", "success");
    });

    web3wallet?.core.relayer.on(RELAYER_EVENTS.disconnect, () => {
      console.log("Network connection lost.", "error");
    });

    SettingsStore.setSessions(Object.values(web3wallet.getActiveSessions()));
  }, [initialized]);

  useEffect(() => {
    // when initial sessions loaded, keep the tab on the new session
    if (sessions.length > 0 && !initSessionsLoaded) {
      setInitSessionsLoaded(true);
      setSelectedTabIndex(sessions.length);
      console.log("sessions", sessions);
    }
  }, [sessions]);

  return (
    <MasterLayout hideConnectWalletBtn={false}>
      <Container mt="10" mb="16" minW={["0", "0", "2xl", "2xl"]}>
        <Tabs index={selectedTabIndex} onChange={setSelectedTabIndex}>
          <TabList>
            {sessions.map((session, i) => (
              <SessionTab key={i} session={session as SessionTypes.Struct} />
            ))}
            {!initialized && (
              <Tab>
                <Spinner />
              </Tab>
            )}
            <Tab>+ New Session</Tab>
          </TabList>
          <TabPanels>
            {!initialized && (
              <TabPanel>
                <Box p={4}>Loading past sessions...</Box>
              </TabPanel>
            )}
            {sessions.map((session, i) => {
              return (
                <TabPanel key={i}>
                  <Box>{session.peer.metadata.name}</Box>
                  <AddressInput
                    isConnected={isConnected}
                    appUrl={appUrl}
                    isIFrameLoading={isIFrameLoading}
                    updateAddress={updateAddress}
                    isEIP155AddressValid={isEIP155AddressValid}
                    setIsEIP155AddressValid={setIsEIP155AddressValid}
                  />
                  <WalletConnect
                    setIsEIP155AddressValid={setIsEIP155AddressValid}
                  />
                </TabPanel>
              );
            })}
            <TabPanel p={0}>
              <Box p={4}>
                <Box>New Session</Box>
                <AddressInput
                  isConnected={isConnected}
                  appUrl={appUrl}
                  isIFrameLoading={isIFrameLoading}
                  updateAddress={updateAddress}
                  isEIP155AddressValid={isEIP155AddressValid}
                  setIsEIP155AddressValid={setIsEIP155AddressValid}
                />
                <WalletConnect
                  setIsEIP155AddressValid={setIsEIP155AddressValid}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      <Modal />
    </MasterLayout>
  );
}
