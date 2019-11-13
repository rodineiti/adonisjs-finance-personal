'use strict'

const { validateAll } = use("Validator");
const User = use("App/Models/User");
const PasswordReset = use('App/Models/PasswordReset')
const Hash = use('Hash')
const randomString = require("random-string");
const Mail = use("Mail");

class PasswordResetController {
	showLinkRequestForm({ view }) {
        return view.render("auth.password.email");
    }

    async sendResetLinkEmail({ request, auth, session, response }) {
        // validate inputs form
        const validation = await validateAll(request.all(), {
          email: "required|email",
        });
    
        if (validation.fails()) {
          session.withErrors(validation.messages());
          return response.redirect("back");
        }

        try {

        	const user = await User.findBy('email', request.input('email'))

	        if (user) {
	            await PasswordReset.query().where('email', user.email).delete()

	            const { token } = await PasswordReset.create({
	            	email: user.email,
	            	token: randomString({ length: 60 })
	            })

	            const mailData = {
	            	user: user.toJSON(),
	            	token
	            }

	            await Mail.send("auth.emails.password_reset", mailData, message => {
			      message
			        .to(user.email)
			        .from("rodinei@teste.com")
			        .subject("Link de redefinição de senha");
			    });

			    session.flash({
			        notification: {
			          type: 'success',
			          message: 'Um link de redefinição de senha foi enviado para o seu endereço de e-mail.'
			        }
			    })

			    return response.redirect('back')
	        }

        } catch(err) {
    		// display success message
	        session.flash({
	            notification: {
	            type: "danger",
	            message:
	                "Desculpe, não há usuário com este endereço de e-mail."
	            }
	        });    	
        }

        return response.redirect("back");
    }

    showResetForm ({ params, view }) {
    	return view.render('auth.password.reset', { token: params.token })
  	}

  	async reset ({ request, session, response }) {
  		// validate form inputs
	    const validation = await validateAll(request.all(), {
	      token: 'required',
	      email: 'required',
	      password: 'required|confirmed'
	    })

	    if (validation.fails()) {
	      session
	        .withErrors(validation.messages())
	        .flashExcept(['password', 'password_confirmation'])

	      return response.redirect('back')
	    }

	    try {
	      // get user by the provider email
	      const user = await User.findBy('email', request.input('email'))

	      // check if password reet token exist for user
	      const token = await PasswordReset.query()
	        .where('email', user.email)
	        .where('token', request.input('token'))
	        .first()

	      if (!token) {
	        // display error message
	        session.flash({
	          notification: {
	            type: 'danger',
	            message: 'Este token de redefinição de senha não existe.'
	          }
	        })

	        return response.redirect('back')
	      }

	      user.password = await Hash.make(request.input('password'))
	      await user.save()

	      // delete password reset token
	      await PasswordReset.query().where('email', user.email).delete()

	      // display success message
	      session.flash({
	        notification: {
	          type: 'success',
	          message: 'Sua senha foi alterada!'
	        }
	      })

	      return response.redirect('/login')
	    } catch (error) {
	      // display error message
	      session.flash({
	        notification: {
	          type: 'danger',
	          message: 'Desculpe, não há usuário com este endereço de e-mail.'
	        }
	      })
	  }

	   return response.redirect('back')
  	}
}

module.exports = PasswordResetController
