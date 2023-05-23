import { useQueryClient } from "react-query";

export const useFetchQueryData = (key) => {
    const queryClient = useQueryClient();

    return queryClient.getQueryData(key);
};