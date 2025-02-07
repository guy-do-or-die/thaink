export const test2 = `
    const fetchWeatherApiResponse = async () => {
        const url = "https://api.weather.gov/gridpoints/LWX/97,71/forecast"
        let toSign
        try {
            const response = await fetch(url).then((res) => res.json())
            const forecast = response.properties.periods[day]
            toSign = { temp: forecast.temperature + " " + forecast.temperatureUnit, shortForecast: forecast.shortForecast }
            const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName })
        } catch (e) {
            console.log(e)
        }
        LitActions.setResponse({ response: JSON.stringify(toSign) })
    }

    fetchWeatherApiResponse()
`

const _litActionCode = async () => {
    try {
        // First decrypt the current digest from the contract
        const currentDigestDecrypted = await Lit.Actions.decrypt({
            encryptedString: digest,
            symmetricKey: digestKey
        });

        // Evaluate the note using our agent
        const agentResponse = await fetch('http://localhost:3001/evaluate-note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idea,
                digest: currentDigestDecrypted,
                note: content
            })
        });

        if (!agentResponse.ok) {
            throw new Error(`Agent evaluation failed: ${agentResponse.statusText}`);
        }

        const result = await agentResponse.json();

        // Sign the evaluation result
        const evaluationSignature = await Lit.Actions.signEcdsa({
            toSign: new TextEncoder().encode(JSON.stringify(result)),
            publicKey,
            sigName: "evaluationSig"
        });

        if (result.worthy) {
            // Create and encrypt a new digest combining idea, previous digest, and note
            const newDigestContent = `${idea}\n${currentDigestDecrypted}\n${content}`;
            const newDigestEncrypted = await Lit.Actions.encrypt({
                dataToEncrypt: newDigestContent,
                symmetricKey: digestKey
            });

            // Encrypt the note for storage
            const noteEncrypted = await Lit.Actions.encrypt({
                dataToEncrypt: content,
                symmetricKey: noteKey
            });

            // Create the transaction data for the addNote function
            const iface = new ethers.utils.Interface([
                "function addNote(address _contributor, string _content, uint256 _value, string _digest)"
            ]);

            const txData = iface.encodeFunctionData("addNote", [
                contributor,
                noteEncrypted,  // Store encrypted note
                ethers.utils.parseEther(result.suggestedValue.toString()),
                newDigestEncrypted  // Store new encrypted digest
            ]);

            // Create the unsigned transaction
            const unsignedTx = {
                to: tankAddress,
                data: txData,
                value: 0,
                gasLimit: 500000,
                nonce,
                maxFeePerGas,
                maxPriorityFeePerGas,
                chainId
            };

            // Get the transaction hash that needs to be signed
            const txHash = ethers.utils.keccak256(
                ethers.utils.serializeTransaction(unsignedTx)
            );

            // Sign the transaction hash
            const txSignature = await Lit.Actions.signEcdsa({
                toSign: ethers.utils.arrayify(txHash),
                publicKey,
                sigName: "txSig"
            });

            // Parse the signature
            const { r, s, v } = ethers.utils.splitSignature(txSignature);

            // Create the signed transaction
            const signedTx = ethers.utils.serializeTransaction(unsignedTx, { r, s, v });

            // Get RPC URL for the chain
            const rpcUrl = await Lit.Actions.getRpcUrl({ chain });
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

            try {
                // Send the transaction
                const tx = await provider.sendTransaction(signedTx);

                Lit.Actions.setResponse({
                    response: JSON.stringify({
                        evaluation: result,
                        evaluationSignature,
                        transaction: {
                            success: true,
                            hash: tx.hash
                        }
                    })
                });
            } catch (error) {
                Lit.Actions.setResponse({
                    response: JSON.stringify({
                        evaluation: result,
                        evaluationSignature,
                        transaction: {
                            success: false,
                            error: error.message
                        }
                    })
                });
            }
        } else {
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    evaluation: result,
                    evaluationSignature
                })
            });
        }
    } catch (error) {
        console.error("Error in Lit Action:", error);
        Lit.Actions.setResponse({
            response: JSON.stringify({
                error: error.message
            })
        });
    }
};

export const test = `(${_litActionCode.toString()})();`;