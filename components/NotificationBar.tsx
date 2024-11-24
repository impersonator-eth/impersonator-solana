import { useState, useEffect } from "react";
import { Alert, Text, Link, HStack, Center } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

function NotificationBar() {
  return (
    <Alert status="info" bg={"#151515"}>
      <Center w="100%">
        <Link
          href={"https://impersonator.xyz"}
          isExternal
          _hover={{
            textDecor: "none",
          }}
        >
          <HStack>
            <Text>to impersonate ETH addresses, visit:</Text>

            <HStack
              ml={-0.5}
              fontWeight="bold"
              position="relative"
              sx={{
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #FF0080, #7928CA, #FF0080)",
                  backgroundSize: "200% 100%",
                  animation: "gradient 3s linear infinite",
                  "@keyframes gradient": {
                    "0%": { backgroundPosition: "0% 0%" },
                    "100%": { backgroundPosition: "200% 0%" },
                  },
                },
              }}
            >
              <Text>impersonator.xyz</Text>
              <ExternalLinkIcon />
            </HStack>
          </HStack>
        </Link>
      </Center>
    </Alert>
  );
}

export default NotificationBar;
