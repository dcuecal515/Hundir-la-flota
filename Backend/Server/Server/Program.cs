using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server;
using Server.Mappers;
using Server.Models;
using Server.Services;
using System.Text;


Directory.SetCurrentDirectory(AppContext.BaseDirectory);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<Settings>(builder.Configuration.GetSection("Settings"));
builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<Settings>>().Value);
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication()
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters()
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,

                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration ["Jwt:Key"]))
                    };
                });
builder.Services.AddScoped<HundirLaFlotaContext>();
builder.Services.AddScoped<UnitOfWork>();
builder.Services.AddScoped<UserMapper>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<ImageService>();
builder.Services.AddScoped<RequestService>();
builder.Services.AddScoped<FriendService>();
builder.Services.AddScoped<FriendMapper>();
builder.Services.AddScoped<GameService>();
builder.Services.AddSingleton<WebSocketService>();
builder.Services.AddScoped<WSHelper>();


builder.Services.AddCors(
                options =>
                options.AddDefaultPolicy(
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                        ;
                    })
                );

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"))
});

app.UseWebSockets();

app.UseMiddleware<WebSocketMiddleware>();

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
PasswordService passwordService = new PasswordService();

using (IServiceScope scope = app.Services.CreateScope())
{
    HundirLaFlotaContext dbContext = scope.ServiceProvider.GetService<HundirLaFlotaContext>();
    if (dbContext.Database.EnsureCreated())
    {
        var user1=new User { NickName = "Manuel", Email = "example@gmail.com", Password = passwordService.Hash("123456"), Avatar = "/images/capitan.jpg", Role = "Admin", Status = "Desconectado" };
        dbContext.Users.Add(user1 );
        dbContext.SaveChanges();
    }
    dbContext.SaveChanges();
}

app.Run();
