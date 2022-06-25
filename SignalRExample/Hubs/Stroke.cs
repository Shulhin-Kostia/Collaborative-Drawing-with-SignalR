namespace SignalRExample.Hubs
{
    //Class that contains information about one stroke on canvas
    public class Stroke
    {
        //stroke start
        public Point Start { get; set; }

        //stroke end
        public Point End { get; set; }

        //stroke color
        public string Color { get; set; }

        //stroke line width
        public int Width { get; set; }
    }
}
