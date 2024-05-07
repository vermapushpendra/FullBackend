//Use of Promise with the Higher Order function 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
    }

}

//Using Try, Catch
// const asyncHandler = (fn) => {
//    async (req, rex, next) => {
//     try {

//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: error.message
//         })

//     }

//     }
// }

export { asyncHandler }