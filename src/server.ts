import app from "./index";

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})