// This will be called if onError is not defined in mutation
const onError = (error, query) => {
    console.error("Unhandled Error: " + error)
}

export default {
    onError
}