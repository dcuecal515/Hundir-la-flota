import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Result } from '../models/result';
import { Request } from '../models/Request';
import { Friend } from '../models/Friend';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  constructor(private api: ApiService) { }

  async receiveRequests():Promise<Result<Request[]>>{
    return this.api.get<Request[]>("Request")
  }
  async receiveFriend():Promise<Result<Friend[]>>{
    return this.api.get<Friend[]>("Friend")
  }
}
