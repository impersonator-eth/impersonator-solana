import { Verify, SessionTypes } from "@walletconnect/types";
import { proxy } from "valtio";
import { mainnet } from "wagmi/chains";

/**
 * Types
 */
interface State {
  initialized: boolean;
  eip155Address: string;
  activeChainId: string;
  currentRequestVerifyContext?: Verify.Context;
  sessions: SessionTypes.Struct[];
  isConnectLoading: boolean;
  isEventsInitialized: boolean;
}

/**
 * State
 */
const state = proxy<State>({
  initialized: false,
  activeChainId: mainnet.id.toString(),
  eip155Address: "",
  sessions: [],
  isConnectLoading: false,
  isEventsInitialized: false,
});

/**
 * Store / Actions
 */
const SettingsStore = {
  state,

  setInitialized(value: boolean) {
    state.initialized = value;
  },

  setEIP155Address(eip155Address: string) {
    state.eip155Address = eip155Address;
  },

  setActiveChainId(value: string) {
    state.activeChainId = value;
  },

  setCurrentRequestVerifyContext(context: Verify.Context) {
    state.currentRequestVerifyContext = context;
  },
  setSessions(sessions: SessionTypes.Struct[]) {
    state.sessions = sessions;
  },

  setIsConnectLoading(isConnectLoading: boolean) {
    state.isConnectLoading = isConnectLoading;
  },

  setIsEventsInitialized(isEventsInitialized: boolean) {
    state.isEventsInitialized = isEventsInitialized;
  },
};

export default SettingsStore;
