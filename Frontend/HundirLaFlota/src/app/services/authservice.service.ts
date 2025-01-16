import { Injectable } from '@angular/core';
import { Login } from '../models/Login';
import { Token } from '../models/token';
import { Result } from '../models/result';
import { ApiService } from './api.service';


@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {

  constructor(private api: ApiService) { }
  async login(login:Login):Promise<Result<Token>>{
    const result=await this.api.post<Token>('login',login)
    if(result.success){
      this.api.jwt=result.data.accessToken;
    }
    return result
  }
}
