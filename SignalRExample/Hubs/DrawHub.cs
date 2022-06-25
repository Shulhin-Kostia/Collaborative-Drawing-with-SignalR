using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SignalRExample.Hubs
{
    //Class that represents SignalR Hub
    public class DocumentHub : Hub
    {
        //New strokes list
        private static List<Stroke> strokes = new List<Stroke>();

        //Send new strokes method
        public async Task NewStrokes(IEnumerable<Stroke> newStrokes)
        {
            lock (strokes)
            {
                strokes.AddRange(newStrokes);
            }
            var tasks = newStrokes.Select(
                s => Clients.Others.SendAsync("newStroke", s.Start, s.End, s.Color, s.Width)); //For all clients except sender, javascript method "newStroke()" called with four specified parameters
            await Task.WhenAll(tasks);
        }

        //Reset canvas method
        public async Task ClearCanvas()
        {
            var task = Clients.Others.SendAsync("clearCanvas"); //For all clients except sender, javascript method "clearCanvas()" called
            lock (strokes)
            {
                strokes.Clear();
            }
            await task;
        }

        //Method, called when connection established. It initialize app with setting draw tool active
        public override async Task OnConnectedAsync()
        {
            var tasks = strokes.Select(s => Clients.Caller.SendAsync("newStroke", s.Start, s.End, s.Color, s.Width));
            await Task.WhenAll(tasks);
        }
    }
}
