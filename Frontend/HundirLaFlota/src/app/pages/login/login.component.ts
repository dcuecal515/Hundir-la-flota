import { Component,ViewChild,ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthserviceService } from '../../services/authservice.service';
import { ApiService } from '../../services/api.service';
import { Login } from '../../models/Login';
import { Router } from '@angular/router';
import { SignUp } from '../../models/SignUp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private formBuilder: FormBuilder,private authservice:AuthserviceService,private apiService:ApiService,private router:Router){
    if(localStorage.getItem("token") || sessionStorage.getItem("token")){
      router.navigateByUrl("menu");
    }
    this.loginForm = this.formBuilder.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
    this.registerForm = this.formBuilder.group({
      nickname: ['', [Validators.required, Validators.pattern("[^@]*")]],
      email: ['', [Validators.required, Validators.email]],
      password:['', [Validators.required]],
      confirmPassword:['',[Validators.required]],
      avatar:['',[Validators.required]]
    })
  }

  passwordMatchValidator(): boolean {
    if(this.password != "" && this.confirmPassword != ""){
      if (this.password == this.confirmPassword) {
        return true
      }
    }
    return false
  }

  /*esto es para las peticiones que hagamos en este componente*/
  loginForm: FormGroup;
  registerForm:FormGroup;
  
  identifier=""
  nickname=""
  email=""
  password=""
  confirmPassword=""
  avatar: File | null = null
  rememberUser=false

  async loginUser():Promise<void>{
    if(this.loginForm.valid){
      const Date:Login={identifier: this.identifier.trim(),password: this.password.trim()}//hace la interfaz
      console.log(Date)//mostrar interfaz
      await this.authservice.login(Date);
      if(this.apiService.jwt!=""){
        await this.rememberfunction()
      }else{
        alert("Este usuario no existe")//poner sweetalert2
      }
    }else{
      alert("Campos invalidos")//poner sweetalert2
    }
  }
  

  async rememberfunction(){
    if(this.rememberUser){
      console.log("Recordando al de forma permanente...")
      localStorage.setItem("token", this.apiService.jwt)
      console.log(localStorage.getItem("token"))
    }else{
      console.log("Recordando al de forma leve...")
      sessionStorage.setItem("token", this.apiService.jwt)
      console.log(sessionStorage.getItem("token"))
    }
    this.router.navigateByUrl("menu");
  }

  async registerUser():Promise<void>{
    if(!this.passwordMatchValidator()){
      alert("Las contraseñas tienen que ser iguales");
    }else if(this.registerForm.valid){
      const User:SignUp={nickname: this.nickname.trim(), email: this.email.trim(), password: this.password.trim(), avatar: this.avatar}
      console.log("Estado de mi jwt: "+this.apiService.jwt);
      await this.authservice.register(User)
      console.log("Estado de mi jwt despues de registro fallido: "+this.apiService.jwt);
      if(this.apiService.jwt){
        console.log("he entrado pro que si xD");
        await this.rememberfunction()
      }
    }
    else{
      alert("Los campos no son validos")
    }

    
  }

  onFileSelected(event: any) {
    const image = event.target.files[0] as File;
    if(image)
    {
      console.log("NUEVA IMAGEN")
      console.log(image)
      this.registerForm.patchValue({avatar: image})
    }
    else
    {
      console.log("NO HAY IMAGEN")
    }
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
