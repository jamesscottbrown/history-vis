
  let createData = {
    type: "popup",
    url: 'index.html'
  };
  let creating = browser.windows.create(createData);
  creating.then(() => {
    console.log("The popup has been created");
  });
