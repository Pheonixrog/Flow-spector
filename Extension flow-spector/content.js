const textComparisonList = [];
let switchValue;
let verifiedElements = [];

window.addEventListener("load", () => {
    chrome.runtime.sendMessage({ message: "content__retrieve", payload: "textComparison" });
    chrome.runtime.sendMessage({ message: "content__retrieve", payload: "switchValue" });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        handleMessages(request);
    });
});

function handleMessages(request) {
    if (request.message === "delete_success") {
        // Delete Query
    } else if (request.message === "update_success") {
        // Update Query
        console.log("PAYLOAD: " + request.payload);
    } else if (request.message.includes("retrieve_success")) {
        handleRetrieveMessages(request);
    } else if (request.message.includes("scrollTo")) {
        scrollToPosition(request.payload);
    }
}

function handleRetrieveMessages(request) {
    if (request.message.includes("switchValue")) {
        switchValue = request.payload.value;
    } else if (request.message.includes("textComparison")) {
        textComparisonList = request.payload.value;
    }

    findDarkPattern();
}

function scrollToPosition(pos) {
    if (pos - 1 >= 0) {
        verifiedElements[pos - 1].element.scrollIntoView();
        verifiedElements[pos - 1].element.style.border = "2px solid red";
    } else {
        window.scrollTo(0, 0);
    }
}

function updateElementList(numElements, elements) {
    if (switchValue) {
        chrome.runtime.sendMessage({
            message: "update",
            payload: { name: "numDarkPatternIdentified", value: numElements }
        });

        chrome.runtime.sendMessage({
            message: "update",
            payload: { name: "darkPatternIdentified", value: elements }
        });

        updateBadge(numElements);
    } else {
        updateBadge("");
    }
}

function updateBadge(newValue) {
    chrome.runtime.sendMessage({
        message: "update__badge",
        payload: { name: "newValue", value: newValue }
    });
}

function findDarkPattern() {
    const checkedElements = verifyElements();
    console.log("[findDarkPattern] ", checkedElements);

    updateElementList(switchValue ? checkedElements.length : 0, checkedElements);
}

function verifyElements() {
    const buttons = document.querySelectorAll("button");
    const links = document.querySelectorAll("a");

    verifiedElements = [];

    buttons.forEach((elem) => {
        const computedStyle = window.getComputedStyle(elem);
        const rgbaValue = computedStyle.backgroundColor;
        const alpha = parseFloat(rgbaValue.split(",")[3]);
        const threshold = 0.5;

        if (alpha < threshold && alpha !== 0) {
            verifiedElements.push({ element: elem, message: "Disguised Button" });
        } else if (textComparisonList.includes(elem.text)) {
            verifiedElements.push({ element: elem, message: elem.text });
        }
    });

    links.forEach((elem) => {
        textComparisonList.forEach((obj) => {
            if (obj.name === elem.text) {
                verifiedElements.push({ element: elem, message: obj.msg });
            }
        });
    });

    return verifiedElements;
}
