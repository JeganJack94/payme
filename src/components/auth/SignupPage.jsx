import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box, InputAdornment } from "@mui/material";
import { AccountCircle, Email, Lock } from "@mui/icons-material";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: formData.username });
            alert("Signup successful! You can now log in.");
            setFormData({ username: "", email: "", password: "" });
            navigate("/login");
        } catch (error) {
            console.error("Error during signup:", error.message);
            alert(error.message);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                backgroundColor: "#e82c2a", // Changed background color
                padding: 2,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 400,
                    backgroundColor: "#fff", // White background for the form
                    padding: 4,
                    borderRadius: 2,
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Typography variant="h4" align="center" gutterBottom sx={{ color: "#000" }}>
                    Sign Up
                </Typography>
                <form onSubmit={handleSignup}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccountCircle />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email ID"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        variant="outlined"
                        type="email"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        variant="outlined"
                        type="password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            marginTop: 2,
                            backgroundColor: "#e82c2a", // Red button
                            color: "#fff", // White text
                            "&:hover": {
                                backgroundColor: "#c62828", // Darker red on hover
                            },
                        }}
                    >
                        Sign Up
                    </Button>
                </form>
                <Typography variant="body2" align="center" sx={{ marginTop: 2, color: "#000" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ textDecoration: "none", color: "#e82c2a" }}>
                        Login here
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
};

export default SignupPage;