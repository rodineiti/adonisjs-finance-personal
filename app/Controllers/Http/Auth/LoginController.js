'use strict'

const { validateAll } = use("Validator");
const User = use("App/Models/User");
const Hash = use('Hash')

class LoginController {
    showLoginForm({ view }) {
        return view.render("auth.login");
    }

    async login({ request, auth, session, response }) {
        // validate inputs form
        const validation = await validateAll(request.all(), {
          email: "required|email",
          password: "required"
        });
    
        if (validation.fails()) {
          session.withErrors(validation.messages());
          return response.redirect("back");
        }

        const user = await User.query().where('email', request.input('email')).where('is_active', true).first()

        if (user) {
            const passwordVerified = await Hash.verify(request.input('password'), user.password)

            if (passwordVerified) {
                await auth.remember(!!request.input('remember')).login(user)

                return response.route('/')
            }
        }
    
        // display success message
        session.flash({
            notification: {
            type: "danger",
            message:
                "Não foi possível verificar suas credenciais. Certifique-se de confirmar seu email."
            }
        });

        return response.redirect("back");
      }
}

module.exports = LoginController
