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
  Center,
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
import { extractSolanaAddressFromSession } from "@/src/helpers/utils";

const SessionTab = ({
  session,
}: {
  session: Readonly<
    Omit<SessionTypes.Struct, "namespaces" | "requiredNamespaces"> & {
      namespaces: {
        [key: string]: {
          chains?: readonly string[];
          accounts: readonly string[];
          methods: readonly string[];
          events: readonly string[];
        };
      };
      requiredNamespaces: {
        [key: string]: {
          chains?: readonly string[];
          methods: readonly string[];
          events: readonly string[];
        };
      };
    }
  >;
}) => {
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

  console.log("sessions", sessions);

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
    // when initial sessions loaded or loading, keep the tab on the new session
    if (!initSessionsLoaded && initialized) {
      setInitSessionsLoaded(true);
      setSelectedTabIndex(sessions.length);
    }
  }, [sessions, initSessionsLoaded, initialized]);

  return (
    <MasterLayout hideConnectWalletBtn={false}>
      <Center mt="8" fontStyle={"italic"}>
        Connect to Solana dapps as any Address!
      </Center>
      <Container mt="8" mb="16" minW={["0", "0", "2xl", "2xl"]}>
        <Tabs index={selectedTabIndex} onChange={setSelectedTabIndex}>
          <TabList>
            {sessions.map((session, i) => (
              <SessionTab
                key={i}
                session={
                  session as Readonly<
                    Omit<
                      SessionTypes.Struct,
                      "namespaces" | "requiredNamespaces"
                    > & {
                      namespaces: {
                        [key: string]: {
                          chains?: readonly string[];
                          accounts: readonly string[];
                          methods: readonly string[];
                          events: readonly string[];
                        };
                      };
                      requiredNamespaces: {
                        [key: string]: {
                          chains?: readonly string[];
                          methods: readonly string[];
                          events: readonly string[];
                        };
                      };
                    }
                  >
                }
              />
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
                    address={extractSolanaAddressFromSession(session)}
                    isConnected={isConnected}
                    appUrl={appUrl}
                    isIFrameLoading={isIFrameLoading}
                    updateAddress={updateAddress}
                    isEIP155AddressValid={isEIP155AddressValid}
                    setIsEIP155AddressValid={setIsEIP155AddressValid}
                  />
                  <Center mt="3rem">✅ Connected</Center>
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
