console.log("Service worker sdf!");

self.addEventListener("push", function(event) {
	var data = event.data.json();
  self.registration.showNotification(data.title, {
  	body: data.message
  });
});