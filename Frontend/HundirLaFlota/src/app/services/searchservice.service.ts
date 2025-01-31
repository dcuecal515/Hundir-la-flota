import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Result } from '../models/result';
import { Friend } from '../models/Friend';

@Injectable({
  providedIn: 'root'
})
export class SearchserviceService {

  constructor(private api: ApiService) { }

  async search(name:string):Promise<Result<Friend[]>>{
    console.log(name);
    return this.api.get<Friend[]>(`Search?name=${name}`)
  }
}
