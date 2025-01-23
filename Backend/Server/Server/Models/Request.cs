﻿using Server.Enums;

namespace Server.Models
{
    public class Request
    {
        public string RequestId { get; set; }
        RequestType RequestType { get; set; }
        public string SenderUserId { get; set; }
        public string ReceivingUserId { get; set; }
    }
}
