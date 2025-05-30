import bcrypt from "bcrypt";

const generateHashedPassword = async () => {
    const password = "admin123"; 
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password:", hashedPassword);
};

generateHashedPassword();