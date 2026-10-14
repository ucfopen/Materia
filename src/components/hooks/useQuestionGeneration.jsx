import { useMutation } from "@tanstack/react-query";
import { apiGenerateQset } from "../../util/api";

export default function useQuestionGeneration() {
    return useMutation(
        {
            mutationFn: apiGenerateQset,
            onSuccess: (data, variables) => {
                variables.successFunc(data)
            },
            onError: (err, variables, context) => {
                variables.errorFunc(err)
            }
        }
    )
}
