export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num <= 0) return "Rupees Zero Only";
  const rounded = Math.round(num);

  const singleDigits = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tensDigits = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertBelowThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tensDigits[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += singleDigits[n] + " ";
    }
    return str.trim();
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  let result = "";

  if (crore > 0) {
    result += convertBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    result += convertBelowThousand(remainder) + " ";
  }

  return `Rupees ${result.trim()} Only`;
}
