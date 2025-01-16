import { Component,ViewChild,ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthserviceService } from '../../services/authservice.service';
import { ApiService } from '../../services/api.service';
import { Login } from '../../models/Login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private formBuilder: FormBuilder,private authservice:AuthserviceService,private apiService:ApiService,private router:Router){
    this.loginForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
  }
  /*esto es para las peticiones que hagamos en este componente*/
  loginForm: FormGroup;
  
  name=""
  password=""
  jwt=""
  remenberUser=false

  async loginUser():Promise<void>{
    if(this.loginForm.valid){
      const Date:Login={name: this.name.trim(),password: this.password.trim()}
      console.log(Date)
      await this.authservice.login(Date);
      if(this.apiService.jwt!=""){
        await this.remenberfunction()
      }else{
        alert("Los datos introducidos son invalidos")//poner sweetalert2
      }
    }else{
      alert("Campos invalidos")//poner sweetalert2
    }
  }
  

  async remenberfunction(){
    if(this.remenberUser){
      console.log("Recordando al usuario...")
      localStorage.setItem("token", this.apiService.jwt)
      console.log(localStorage.getItem("token"))
    }else{
      console.log("Recordando al usuario...")
      sessionStorage.setItem("token", this.apiService.jwt)
      console.log(sessionStorage.getItem("token"))
    }
    this.router.navigateByUrl("menu");
  }




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
