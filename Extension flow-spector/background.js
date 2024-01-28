chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "delete") {
		let delete_request = deleteValue(request.payload);

		delete_request.then((res) => {
			chrome.runtime.sendMessage({
				message: "delete_success",
				payload: res,
			});
		});
	} else if (request.message === "update") {
		let update_request = updateValue(request.payload);
		update_request.then((res) => {
			chrome.runtime.sendMessage({
				message: "update_success",
				payload: res,
			});
		});
	} else if (request.message === "retrieve") {
		let retrieve_request = retrieveValue(request.payload);

		retrieve_request.then((res) => {
			chrome.runtime.sendMessage({
				message: "retrieve_success " + request.payload,
				payload: res,
			});
		});
	} else if (request.message === "content__delete") {
		let delete_request = deleteValue(request.payload);
	} else if (request.message === "content__update") {
		let update_request = updateValue(request.payload);
	} else if (request.message === "content__retrieve") {
		console.log("Content Retrieve");
		let retrieve_request = retrieveValue(request.payload);

		retrieve_request.then((res) => {
			chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
				var activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {
					message: "retrieve_success " + request.payload,
					payload: res,
				});
			});
		});
	} else if (request.message === "update__badge") {
		let newValue = request.payload.value;
		chrome.action.setBadgeText({ text: "" + newValue });
		chrome.action.setBadgeBackgroundColor({ color: "#A30000" });
	}
});

let defaultValues = [
	{
		name: "switchValue",
		value: true,
	},
	{
		name: "numDarkPatternIdentified",
		value: 0,
	},
	{
		name: "darkPatternIdentified",
		value: [{}],
	},
	{
		name: "textComparison",
		value: {},
	},
];

let textComparisonArray = fetch("common.json")
	.then((response) => {
		if (!response.ok) {
			throw new Error("Error requesting the JSON file");
		}
		return response.json();
	})
	.then((jsonObject) => {
		const setText = defaultValues.map((obj) => {
			if (obj.name === "textComparison") {
				obj.value = jsonObject.TextComparison;
				console.log(obj);
			}
		});
	})
	.catch((error) => {
		console.log("Error: " + error);
	});

let db = null;

function createDB() {
	const request = self.indexedDB.open("UtilsDB", 1);

	request.onerror = function (event) {
		console.log("[ERROR] Database opening failed");
	};

	request.onupgradeneeded = function (event) {
		db = event.target.result;

		let objectStore = db.createObjectStore("utils", {
			keyPath: "name",
		});

		objectStore.transaction.oncomplete = function (event) {
			console.log("[COMPLETE] ObjectStore create");
		};
	};

	request.onsuccess = function (event) {
		db = event.target.result;
		console.log("[SUCCESS] Database opening sucessful");

		insertValue(defaultValues); 

		db.onerror = function (event) {
			console.log("[ERROR] Database opening failed");
		};
	};
}

function insertValue(values) {
	if (db) {
		const insertTransaction = db.transaction("utils", "readwrite");
		const objectStore = insertTransaction.objectStore("utils");

		return new Promise((resolve, reject) => {
			insertTransaction.oncomplete = function () {
				console.log("[COMPLETE] Insert Transition Completed");
				resolve(true);
			};

			insertTransaction.onerror = function () {
				console.log("[ERROR] Defualt values already Present");
				resolve(false);
			};

			values.forEach((util) => {
				let request = objectStore.add(util);

				request.onsuccess = function () {
					console.log("[SUCCESS] Added " + util.name + " " + util.value);
				};
			});
		});
	}
}

function updateValue(object) {
	if (db) {
		const putTransaction = db.transaction("utils", "readwrite");
		const objectStore = putTransaction.objectStore("utils");

		return new Promise((resolve, reject) => {
			putTransaction.oncomplete = function () {
				console.log("[COMPLETE] Update Transition Completed");
				resolve(true);
			};

			putTransaction.onerror = function () {
				console.log("[ERROR] Problem updating");
				resolve(false);
			};

			objectStore.put(object);
		});
	}
}

function deleteValue(name) {
	if (db) {
		const deleteTransaction = db.transaction("utils", "readwrite");
		const objectStore = deleteTransaction.objectStore("utils");

		return new Promise((resolve, reject) => {
			deleteTransaction.oncomplete = function () {
				console.log("[COMPLETE] Removal Transition Completed");
				resolve(true);
			};

			deleteTransaction.onerror = function () {
				console.log("[ERROR] Problem Removing");
				resolve(false);
			};

			objectStore.delete(name);
		});
	}
}

function retrieveValue(name) {
	const retrieveTransaction = db.transaction("utils", "readonly");
	const objectStore = retrieveTransaction.objectStore("utils");

	return new Promise((resolve, reject) => {
		retrieveTransaction.oncomplete = function () {
			console.log("[COMPLETE] Recovery Transition Completed");
		};

		retrieveTransaction.onerror = function () {
			console.log("[ERROR] Problem Recovering");
		};

		let request = objectStore.get(name);

		request.onsuccess = function (event) {
			resolve(event.target.result);
		};
	});
}

createDB();
