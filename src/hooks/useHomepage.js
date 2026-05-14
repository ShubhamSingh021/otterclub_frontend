import { useCallback, useEffect, useState } from "react";
import { getHomepageContent } from "../api/homepageApi";

const readErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return "Unable to load homepage data.";
};

export const useHomepage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHomepage = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await getHomepageContent();
      setData(payload);
    } catch (requestError) {
      setError(readErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomepage();
  }, [fetchHomepage]);

  return { data, isLoading, error, refetch: fetchHomepage };
};
