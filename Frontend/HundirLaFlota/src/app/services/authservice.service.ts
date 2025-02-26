import { Injectable } from '@angular/core';
import { Login } from '../models/Login';
import { SignUp } from '../models/SignUp';
import { Token } from '../models/token';
import { Result } from '../models/result';
import { ApiService } from './api.service';
import { UserReceived } from '../models/UserReceived';
import { environment } from '../../environments/environment.development';
import { Image } from '../models/image';


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

  async register(signup:SignUp,avatar:File): Promise<Result<Token>>{
    const result=await this.api.postWithImage<Token>('Auth/signup', this.createForm(signup,avatar))
    if(result.success){
      console.log("Entró con accessToken: ",result.data.accessToken)
      this.api.jwt = result.data.accessToken;
    }else{
      alert("Hubo un problema")
    }
    return result
  }

  async getUserById(id:number):Promise<UserReceived>{
    const path = "User/" + id
    const result = await this.api.get<UserReceived>(path,{},'json')
    result.data.avatar = environment.images+result.data.avatar;
    return result.data
  }

  async changeImageservice(image:File):Promise<Result<Image>>{
    console.log(image)
    const result=await this.api.putWithImage<Image>('User/image',this.createFormImage(image))
    return result
  }

  createForm(signup:SignUp,avatar:File) : FormData{
    const formdata = new FormData()
    console.log("Mi imagen es esta: ",avatar)
    formdata.append("nickname", signup.nickname)
    formdata.append("email", signup.email)
    formdata.append("password", signup.password)
    if(avatar){
      formdata.append("avatar",avatar)
    }
    console.log(formdata)
    return formdata;
  }
  createFormImage(image:File):FormData{
    console.log(image)
    const formdata = new FormData()
    formdata.append("image",image)
    return formdata
  }
}
