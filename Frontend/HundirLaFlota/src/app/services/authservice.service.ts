import { Injectable } from '@angular/core';
import { Login } from '../models/Login';
import { SignUp } from '../models/SignUp';
import { Token } from '../models/token';
import { Result } from '../models/result';
import { ApiService } from './api.service';


@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {

  constructor(private api: ApiService) { }
  async login(login:Login):Promise<Result<Token>>{
    const result=await this.api.post<Token>('Auth/login',login)
    if(result.success){
      this.api.jwt=result.data.accessToken;
    }
    return result
  }

  async register(signup:SignUp): Promise<Result<Token>>{
    const result=await this.api.postWithImage<Token>('Auth/signup', this.createForm(signup))
    if(result.success){
      this.api.jwt = result.data.accessToken;
    }else{
      alert("Hubo un problema")
    }
    return result
  }

  createForm(signup:SignUp) : FormData{
    const formdata = new FormData()

    formdata.append("nickname", signup.nickname)
    formdata.append("email", signup.email)
    formdata.append("password", signup.password)
    if(signup.avatar){
      formdata.append("avatar", signup.avatar)
    }
    console.log(formdata)
    return formdata;
  }
}
