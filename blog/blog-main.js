function callback(data) {
 var blog = data["blog"]
for (x in blog[0]) {
  $('.playground').append('<p>' + blog[0][x]["postName"] + '</p>')
};

}
$(document).ready(function(){
$.ajax({
     type: 'GET',
     url: 'https://dylan5797.github.io/blog/blogdata.json',
     success: callback
});
});
