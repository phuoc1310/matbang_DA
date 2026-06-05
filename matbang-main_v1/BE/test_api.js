async function test() {
  const res = await fetch('http://localhost:3033/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listing_id: 9977,
      user_id: 5,
      rating: 5,
      comment: 'test'
    })
  });
  const data = await res.text();
  console.log(res.status, data);
  process.exit();
}
test();
