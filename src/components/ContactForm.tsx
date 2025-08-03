import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Sending...");

    const res = await fetch("https://formsubmit.co/ajax/support@putuporshutup.online", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email, message }),
    });

    const result = await res.json();

    if (result.success === "true") {
      setStatus("✅ Message sent successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setStatus("❌ Failed to send. Please try again.");
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10 p-4 shadow-xl rounded-2xl border-border">
      <CardContent>
        <h2 className="text-xl font-bold mb-4 text-center">Contact Support</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <Textarea
            placeholder="Type your message..."
            rows={5}
            value={message}
            required
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
        {status && <p className="text-sm text-center mt-2">{status}</p>}
      </CardContent>
    </Card>
  );
}