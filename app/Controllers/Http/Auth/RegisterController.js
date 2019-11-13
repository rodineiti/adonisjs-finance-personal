"use strict";

const randomString = require("random-string");
const { validateAll } = use("Validator");
const User = use("App/Models/User");
const Mail = use("Mail");

class RegisterController {
  showRegisterForm({ view }) {
    return view.render("auth.register");
  }

  async register({ request, session, response }) {
    // validate inputs form
    const validation = await validateAll(request.all(), {
      username: "required|unique:users,username",
      email: "required|email|unique:users,email",
      password: "required|min:6"
    });

    if (validation.fails()) {
      session.withErrors(validation.messages()).flashExcept(["password"]);
      return response.redirect("back");
    }

    // create user
    const user = await User.create({
      username: request.input("username"),
      email: request.input("email"),
      password: request.input("password"),
      confirmation_token: randomString({ length: 60 })
    });
    // send confirmation email
    await Mail.send("auth.emails.confirm_email", user.toJSON(), message => {
      message
        .to(user.email)
        .from("rodinei@teste.com")
        .subject("Por favor, confirme seu endereço de email");
    });
    // display success message
    session.flash({
      notification: {
        type: "success",
        message:
          "Registro bem-sucedido! Uma mensagem foi enviada para o seu endereço de e-mail, confirme seu endereço de e-mail."
      }
    });

    return response.redirect("back");
  }

  async confirmEmail ({ params, session, response }) {
    // get user by token
    const user = await User.findBy('confirmation_token', params.token)

    // reset token and active user
    user.confirmation_token = null
    user.is_active = true

    //save
    await user.save()

    // display success message
    session.flash({
      notification: {
        type: "success",
        message:
          "Seu email foi confirmado"
      }
    });

    return response.redirect("/login");
  }
}

module.exports = RegisterController;
