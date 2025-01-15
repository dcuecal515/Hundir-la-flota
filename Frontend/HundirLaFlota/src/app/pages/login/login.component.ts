import { Component,ViewChild,ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthserviceService } from '../../services/authservice.service';
import { Login } from '../../models/Login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private formBuilder: FormBuilder,private authservice:AuthserviceService){
    this.loginForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
  }
  /*esto es para las peticiones que hagamos en este componente*/
  loginForm: FormGroup;
  
  name=""
  password=""

  async loginUser():Promise<void>{
    if(this.loginForm.valid){
      const Date:Login={name: this.name.trim(),password: this.password.trim()}
      console.log(Date)
      const result = await this.authservice.login(Date);
      
    }else{
      alert("Los datos introducidos son invalidos")
    }
    
  }
  remenberfunction()




  /*Esto es typescript para la vison de la pagina*/
  @ViewChild('login', { static: true }) login!: ElementRef;
  @ViewChild('signup', { static: false }) signup!: ElementRef;
  
  changesignup(){
    this.login.nativeElement.style.display='none'
    this.signup.nativeElement.style.display='flex'
  }
  changelogin(){
    this.signup.nativeElement.style.display='none'
    this.login.nativeElement.style.display='flex'
  }
}
