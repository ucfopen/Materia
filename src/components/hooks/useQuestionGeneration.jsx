import { useMutation } from "react-query";
import { apiGenerateQset } from "../../util/api";

export default function useQuestionGeneration() {
    return useMutation(
        apiGenerateQset,
        {
            onSuccess: (qset, variables) => {
                variables.successFunc(qset)
            },
            onError: (error, variables, context) => {
                variables.errorFunc(error)
            }
        }
    )
}
