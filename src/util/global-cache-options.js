// This will be called if onError is not defined in mutation
export const onError = (error, query) => {
    console.error("Unhandled Error: " + error)
}