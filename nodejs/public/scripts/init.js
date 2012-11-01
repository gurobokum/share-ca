$(function () {

    var link = $("#feedback");
    var EMAIL_REGEXP = /[\w\d]+@[\w\d]+\.\w{2,}/; 

    $.ajax({
        url : "/feedback.tmpl",
        success : function (formHTML) {
            var form = $(formHTML);
            $("body").append(form);

            var position = link.offset();
            var linkTop = position.top;
            var linkLeft = position.left;
            var rect = form.get(0).getBoundingClientRect();
            var offset = 5;
            
            var top = linkTop - form.height() - parseInt(form.css("padding-top")) - parseInt(form.css("padding-bottom"));

            form.offset({
                "left": linkLeft - offset,
                "top": top - offset
            })
            link.click(function (e) {
                $("#email", form).focus();
                form.show();
                e.preventDefault();
                e.stopPropagation();
            });

            form.click(function (e) {
                e.stopPropagation();
            });

            $("#submit", form).click(function (e) {
                e.preventDefault();
                if (!validate(form))
                    return;
                form.hide();
                $.ajax({
                    "url": "message",
                    "type": "POST",
                    "data": {
                        mail: form.find("#email").val(),
                        message: form.find("#textarea").val()
                    }
                });
            });

            var email = $("#email", form);
            var text = $("#textarea", form);
            email.blur(function () {
                email.removeClass("invalid");
            }).focus(function () {
                email.removeClass("invalid");
            });

            text.blur(function () {
                text.removeClass("invalid");
            }).focus(function () {
                text.removeClass("invalid");
            });

            $(document).click(function () {
                form.hide();
            })
        }
    })

    function validate(form) {
        var email = $("#email", form);
        var text = $("#textarea", form);
        var isValid = true;

        if (!EMAIL_REGEXP.test(email.val())) {
            email.addClass("invalid");
            isValid = false;
        } else {
            email.removeClass("invalid");
        };

        if (text.val()) {
            text.removeClass("invalid");
        } else {
            text.addClass("invalid");
            isValid = false;
        };

        return isValid;
    };
});
