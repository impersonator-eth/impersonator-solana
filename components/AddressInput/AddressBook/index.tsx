import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HStack,
  ModalCloseButton,
  ModalBody,
  Text,
  Input,
  Center,
  Button,
  Box,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { slicedText } from "@/src/helpers/utils";
import SettingsStore from "@/src/store/SettingsStore";

const STORAGE_KEY = "address-book";

interface SavedAddressInfo {
  address: string;
  label: string;
}

interface AddressBookParams {
  isAddressBookOpen: boolean;
  closeAddressBook: () => void;
  showAddress: string;
  setShowAddress: (address: string) => void;
}

// Helper function to get initial addresses
const getInitialAddresses = (): SavedAddressInfo[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading addresses:", error);
    return [];
  }
};

function AddressBook({
  isAddressBookOpen,
  closeAddressBook,
  showAddress,
  setShowAddress,
}: AddressBookParams) {
  const [newAddressInput, setNewAddressInput] = useState<string>("");
  const [newLabelInput, setNewLabelInput] = useState<string>("");
  // Initialize with localStorage value directly
  const [savedAddresses, setSavedAddresses] =
    useState<SavedAddressInfo[]>(getInitialAddresses);

  useEffect(() => {
    setNewAddressInput(showAddress);
  }, [showAddress]);

  // Only save to localStorage when savedAddresses actually changes
  useEffect(() => {
    if (savedAddresses.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAddresses));
    }
  }, [savedAddresses]);

  // Reset label when modal is reopened
  useEffect(() => {
    setNewLabelInput("");
  }, [isAddressBookOpen]);

  const handleSaveAddress = () => {
    setSavedAddresses((prev) => [
      ...prev,
      {
        address: newAddressInput,
        label: newLabelInput,
      },
    ]);
    setNewLabelInput(""); // Clear input after saving
  };

  const handleDeleteAddress = (index: number) => {
    setSavedAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isAddressBookOpen} onClose={closeAddressBook} isCentered>
      <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="5px" />
      <ModalContent
        minW={{
          base: 0,
          sm: "30rem",
          md: "40rem",
          lg: "60rem",
        }}
        pb="6"
        bg={"brand.lightBlack"}
      >
        <ModalHeader>Address Book</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack>
            <Input
              placeholder="solana address"
              value={newAddressInput}
              onChange={(e) => setNewAddressInput(e.target.value)}
            />
            <Input
              placeholder="label"
              value={newLabelInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
            />
          </HStack>
          <Center mt="3">
            <Button
              colorScheme={"blue"}
              isDisabled={
                newAddressInput.length === 0 || newLabelInput.length === 0
              }
              onClick={() => {
                setSavedAddresses((prev) => [
                  ...prev,
                  {
                    address: newAddressInput,
                    label: newLabelInput,
                  },
                ]);
                setNewLabelInput(""); // Clear label input after saving
              }}
            >
              <HStack>
                <FontAwesomeIcon icon={faSave} />
                <Text>Save</Text>
              </HStack>
            </Button>
          </Center>
          {savedAddresses.length > 0 && (
            <Box mt="6" px="20">
              <Text fontWeight={"bold"}>Select from saved addresses:</Text>
              <Box mt="3" px="10">
                {savedAddresses.map(({ address, label }, i) => (
                  <HStack key={i} mt="2">
                    <Button
                      key={i}
                      minW="0"
                      maxW="100%"
                      whiteSpace="normal"
                      onClick={() => {
                        setShowAddress(address);
                        SettingsStore.setEIP155Address(address);
                        closeAddressBook();
                      }}
                    >
                      {label} (
                      {address.indexOf(".eth") >= 0
                        ? address
                        : slicedText(address)}
                      )
                    </Button>
                    <Button
                      ml="2"
                      _hover={{
                        bg: "red.500",
                      }}
                      onClick={() => {
                        setSavedAddresses((prev) =>
                          prev.filter((_, index) => index !== i)
                        );
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </HStack>
                ))}
              </Box>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AddressBook;
