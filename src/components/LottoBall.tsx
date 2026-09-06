export function LottoBall({number}:{number:number}){const range=Math.min(5,Math.ceil(number/10));return <span className={`ball range-${range}`} aria-label={`Number ${number}`}>{number}</span>}
