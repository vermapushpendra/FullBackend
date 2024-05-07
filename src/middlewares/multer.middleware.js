import multer from 'multer'

//Middleware
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
        
        next();
    }


})

export const upload = multer(
    {
        storage,
    }
)