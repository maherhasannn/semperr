"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { routes, protectedRoutes } from "@/resources";
import { Flex, Spinner, Button, Heading, Column, PasswordInput } from "@once-ui-system/core";
import NotFound from "@/app/not-found";

interface RouteGuardProps {
  children: React.ReactNode;
}

const checkRouteEnabled = (pathname: string | null) => {
  if (!pathname) return false;

  if (pathname in routes) {
    return routes[pathname as keyof typeof routes];
  }

  const dynamicRoutes = ["/blog", "/work"] as const;
  for (const route of dynamicRoutes) {
    if (pathname?.startsWith(route) && routes[route]) {
      return true;
    }
  }

  return false;
};

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const isProtected = !!protectedRoutes[pathname as keyof typeof protectedRoutes];

  const [isRouteEnabled, setIsRouteEnabled] = useState(() => checkRouteEnabled(pathname));
  const [isPasswordRequired, setIsPasswordRequired] = useState(isProtected);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(isProtected);

  useEffect(() => {
    setIsRouteEnabled(checkRouteEnabled(pathname));

    if (isProtected) {
      setIsPasswordRequired(true);
      setIsAuthenticated(false);
      setLoading(true);

      fetch("/api/check-auth").then((response) => {
        if (response.ok) {
          setIsAuthenticated(true);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setIsPasswordRequired(false);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [pathname, isProtected]);

  const handlePasswordSubmit = async () => {
    const response = await fetch("/api/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      setError(undefined);
    } else {
      setError("Incorrect password");
    }
  };

  if (loading) {
    return (
      <Flex fillWidth paddingY="128" horizontal="center">
        <Spinner />
      </Flex>
    );
  }

  if (!isRouteEnabled) {
    return <NotFound />;
  }

  if (isPasswordRequired && !isAuthenticated) {
    return (
      <Column paddingY="128" maxWidth={24} gap="24" center>
        <Heading align="center" wrap="balance">
          This page is password protected
        </Heading>
        <Column fillWidth gap="8" horizontal="center">
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorMessage={error}
          />
          <Button onClick={handlePasswordSubmit}>Submit</Button>
        </Column>
      </Column>
    );
  }

  return <>{children}</>;
};

export { RouteGuard };
