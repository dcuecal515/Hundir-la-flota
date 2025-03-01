namespace Server.DTOs
{
    public class UserInformation
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string NickName { get; set; }
        public string Avatar { get; set; }
        public string Role { get; set; }

        public string Ban {  get; set; }

    }
}
