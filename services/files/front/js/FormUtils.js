export function checkConfirmPassword(confirmElement, passwordValue, confirmPassword) {
    let isValid = true;
    if (passwordValue && confirmPassword) {
        if (passwordValue !== confirmPassword) {
            isValid = false;
            confirmElement.setAttribute("error", "true");
            confirmElement.setAttribute("error-message", "Passwords don't match");
        } else {
            confirmElement.setAttribute("error", "false");
            confirmElement.removeAttribute("error-message");
        }
    }
    return isValid;
}

export function checkRequired(inputs) {
    let isValid = true;

    inputs.forEach(input => {
        const value = input.shadowRoot.querySelector("input").value;

        if (!value || value.length === 0) {
            isValid = false;
            input.setAttribute("error", "true");
            input.setAttribute("error-message", "This field is required");
        } else {
            input.setAttribute("error", "false");
            input.removeAttribute("error-message");
        }
    });

    return isValid;
}

export function getInputsData(inputs) {
    return Object.fromEntries(Array.from(inputs).map(formInput => {
        if (formInput.shadowRoot) {
            const inputElement = formInput.shadowRoot.querySelector("input");
            if (inputElement) {
                return [inputElement.id, inputElement.value];
            }
        }
        return null;
    }).filter(([_, value]) => value !== null));
}