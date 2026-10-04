document.addEventListener("DOMContentLoaded", function () {

    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("loginButton");

    const loginError =
        document.getElementById("loginError");

    const togglePassword =
        document.getElementById("togglePassword");


    // ========================================
    // CHECK IF ALREADY LOGGED IN
    // ========================================

    fetch("/api/check-auth")
        .then(response => response.json())
        .then(data => {

            if (data.authenticated) {

                window.location.href = "/admin";

            }

        })
        .catch(error => {

            console.log(
                "Authentication check failed:",
                error
            );

        });


    // ========================================
    // TOGGLE PASSWORD VISIBILITY
    // ========================================

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                if (
                    passwordInput.type === "password"
                ) {

                    passwordInput.type = "text";

                    togglePassword.innerHTML =
                        '<i class="fas fa-eye-slash"></i>';

                } else {

                    passwordInput.type = "password";

                    togglePassword.innerHTML =
                        '<i class="fas fa-eye"></i>';

                }

            }
        );

    }


    // ========================================
    // LOGIN
    // ========================================

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            loginError.classList.remove("show");

            loginError.textContent = "";


            if (!email || !password) {

                loginError.textContent =
                    "Please enter your email and password.";

                loginError.classList.add("show");

                return;
            }


            loginButton.disabled = true;

            loginButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Signing in...
            `;


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Login failed"
                    );

                }


                // ========================================
                // LOGIN SUCCESS
                // ========================================

                window.location.href =
                    "/admin";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                loginError.textContent =
                    error.message;

                loginError.classList.add("show");


                loginButton.disabled = false;

                loginButton.innerHTML = `
                    <i class="fas fa-right-to-bracket"></i>
                    Login
                `;

            }

        }
    );

});