import multer from 'multer'

//Middleware
const storage = multer.diskStorage({
    destination: (_, file, cb) => {
        cb(null, './public/temp');
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);

    }

})

export const upload = multer(
    {
        storage,
    }
)