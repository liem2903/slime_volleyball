export function convertDate(date: string): string {
  let temp_date = new Date(date); 

  return temp_date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function convertTime(time: string): string {
  let temp_date = new Date(time);

  return temp_date.toLocaleTimeString("en-UK", 
    {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }
  )
}