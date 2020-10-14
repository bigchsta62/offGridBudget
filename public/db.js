//I borrowed this code from @ https://github.com/MarcusTravis
//and modified it to work with my app.

let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  // check if network is working before reading from indexdb
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Whoops! " + event.target.errorCode);
};

function saveRecord(record) {
  // create pending transaction
  const transaction = db.transaction(["pending"], "readwrite");

  //pending transction store
  const store = transaction.objectStore("pending");

  // add transaction
  store.add(record);
}

function checkDatabase() {
  // open a transaction in indexdb
  const transaction = db.transaction(["pending"], "readwrite");
  // access pending trasaction
  const store = transaction.objectStore("pending");
  // get all transactions and set to variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction in indexdb
        const transaction = db.transaction(["pending"], "readwrite");

        // access pending trasaction store
        const store = transaction.objectStore("pending");

        // clear all transactions in indexdb
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);